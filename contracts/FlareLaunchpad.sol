// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FlareLaunchpad is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant VIRTUAL_USDC_RESERVE = 3_600 * 1e6;
    uint256 public constant VIRTUAL_TOKEN_SUPPLY  = 1_000_000_000 * 1e6;
    uint256 public constant GRADUATION_THRESHOLD  = 69_000 * 1e6;
    uint256 public constant FEE_PERCENT           = 100;   // 1% protocol fee (basis points)
    uint256 public constant MAX_CREATOR_FEE       = 1_000; // 10% max creator fee (basis points)
    uint256 private constant BPS_DENOMINATOR      = 10_000;

    IERC20  public immutable usdc;
    address public feeRecipient;
    uint256 public creationFee;

    uint256 private _tokenCount;

    struct TokenInfo {
        uint256 id;
        string  name;
        string  symbol;
        string  imageUrl;
        address creator;
        uint256 createdAt;
        uint256 totalSupply;
        uint256 virtualUsdcReserve;
        uint256 virtualTokenReserve;
        uint256 realUsdcCollected;
        uint256 creatorFeeBps;      // creator fee in basis points (0-1000)
        address creatorFeeWallet;   // where creator fees go
        bool    graduated;
    }

    mapping(uint256 => TokenInfo)                    private _tokens;
    mapping(uint256 => mapping(address => uint256))  public  tokenBalances;

    error SlippageExceeded();

    event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, string symbol);
    event TokensPurchased(uint256 indexed tokenId, address indexed buyer,  uint256 usdcAmount, uint256 tokensReceived, uint256 newPrice);
    event TokensSold(    uint256 indexed tokenId, address indexed seller,  uint256 tokenAmount, uint256 usdcReceived,  uint256 newPrice);
    event TokenGraduated(uint256 indexed tokenId, uint256 usdcCollected);
    event PayoutClaimed( uint256 indexed tokenId, address indexed user,    uint256 usdcAmount);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);

    modifier tokenExists(uint256 tokenId) {
        require(tokenId != 0 && tokenId <= _tokenCount, "Token does not exist");
        _;
    }

    constructor(address usdc_, address feeRecipient_) Ownable(msg.sender) {
        require(usdc_         != address(0), "USDC address is zero");
        require(feeRecipient_ != address(0), "Fee recipient is zero");
        usdc         = IERC20(usdc_);
        feeRecipient = feeRecipient_;
        creationFee  = 1 * 1e6; // 1 USDC
    }

    /// @notice V1 uses internal accounting. A transferable ERC-20 will be deployed at graduation in V2.
    /// @param creatorFeeBps  Creator fee in basis points (0 = no fee, 1000 = 10%). Max 10%.
    /// @param creatorFeeWallet  Address that receives the creator fee on each trade. Defaults to msg.sender if zero.
    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata imageUrl,
        uint256         creatorFeeBps,
        address         creatorFeeWallet
    ) external {
        require(bytes(name).length   > 0,                    "Name required");
        require(bytes(symbol).length > 0,                    "Symbol required");
        require(creatorFeeBps        <= MAX_CREATOR_FEE,     "Creator fee too high");

        address feeWallet = (creatorFeeWallet == address(0)) ? msg.sender : creatorFeeWallet;

        usdc.safeTransferFrom(msg.sender, feeRecipient, creationFee);

        _tokenCount += 1;
        uint256 tokenId = _tokenCount;

        _tokens[tokenId] = TokenInfo({
            id:                   tokenId,
            name:                 name,
            symbol:               symbol,
            imageUrl:             imageUrl,
            creator:              msg.sender,
            createdAt:            block.timestamp,
            totalSupply:          0,
            virtualUsdcReserve:   VIRTUAL_USDC_RESERVE,
            virtualTokenReserve:  VIRTUAL_TOKEN_SUPPLY,
            realUsdcCollected:    0,
            creatorFeeBps:        creatorFeeBps,
            creatorFeeWallet:     feeWallet,
            graduated:            false
        });

        emit TokenCreated(tokenId, msg.sender, name, symbol);
    }

    function buyTokens(uint256 tokenId, uint256 usdcAmount, uint256 minOut)
        external nonReentrant tokenExists(tokenId)
    {
        require(usdcAmount > 0, "Amount must be > 0");

        TokenInfo storage token = _tokens[tokenId];
        require(!token.graduated, "Token graduated");

        // Protocol fee
        uint256 protocolFee = (usdcAmount * FEE_PERCENT) / BPS_DENOMINATOR;
        // Creator fee (taken from the remaining amount after protocol fee)
        uint256 creatorFee_ = (usdcAmount * token.creatorFeeBps) / BPS_DENOMINATOR;
        uint256 usdcIn      = usdcAmount - protocolFee - creatorFee_;
        require(usdcIn > 0, "Net amount is zero");

        if (protocolFee > 0) usdc.safeTransferFrom(msg.sender, feeRecipient,          protocolFee);
        if (creatorFee_ > 0) usdc.safeTransferFrom(msg.sender, token.creatorFeeWallet, creatorFee_);
        usdc.safeTransferFrom(msg.sender, address(this), usdcIn);

        uint256 tokensOut = (token.virtualTokenReserve * usdcIn) / (token.virtualUsdcReserve + usdcIn);
        require(tokensOut > 0, "Tokens out is zero");
        if (tokensOut < minOut) revert SlippageExceeded();

        token.virtualUsdcReserve  += usdcIn;
        token.virtualTokenReserve -= tokensOut;
        token.realUsdcCollected   += usdcIn;
        token.totalSupply         += tokensOut;
        tokenBalances[tokenId][msg.sender] += tokensOut;

        uint256 newPrice = _getCurrentPrice(token);
        emit TokensPurchased(tokenId, msg.sender, usdcAmount, tokensOut, newPrice);

        if (token.realUsdcCollected >= GRADUATION_THRESHOLD) _graduate(tokenId);
    }

    function sellTokens(uint256 tokenId, uint256 tokenAmount, uint256 minOut)
        external nonReentrant tokenExists(tokenId)
    {
        require(tokenAmount > 0, "Amount must be > 0");

        TokenInfo storage token = _tokens[tokenId];
        require(!token.graduated, "Token graduated");

        uint256 userBalance = tokenBalances[tokenId][msg.sender];
        require(userBalance >= tokenAmount, "Insufficient balance");

        uint256 usdcOutGross = (token.virtualUsdcReserve * tokenAmount) / (token.virtualTokenReserve + tokenAmount);
        require(usdcOutGross > 0, "USDC out is zero");

        uint256 protocolFee = (usdcOutGross * FEE_PERCENT)           / BPS_DENOMINATOR;
        uint256 creatorFee_ = (usdcOutGross * token.creatorFeeBps)   / BPS_DENOMINATOR;
        uint256 usdcToSeller = usdcOutGross - protocolFee - creatorFee_;
        if (usdcToSeller < minOut) revert SlippageExceeded();

        require(token.realUsdcCollected >= usdcOutGross, "Insufficient collected reserve");

        tokenBalances[tokenId][msg.sender] = userBalance - tokenAmount;
        token.totalSupply         -= tokenAmount;
        token.virtualUsdcReserve  -= usdcOutGross;
        token.virtualTokenReserve += tokenAmount;
        token.realUsdcCollected   -= usdcOutGross;

        if (protocolFee > 0) usdc.safeTransfer(feeRecipient,          protocolFee);
        if (creatorFee_ > 0) usdc.safeTransfer(token.creatorFeeWallet, creatorFee_);
        usdc.safeTransfer(msg.sender, usdcToSeller);

        uint256 newPrice = _getCurrentPrice(token);
        emit TokensSold(tokenId, msg.sender, tokenAmount, usdcToSeller, newPrice);
    }

    function claimGraduationPayout(uint256 tokenId) external nonReentrant tokenExists(tokenId) {
        TokenInfo storage token = _tokens[tokenId];
        require(token.graduated, "Token not graduated");

        uint256 userBalance = tokenBalances[tokenId][msg.sender];
        require(userBalance > 0, "No balance");

        uint256 usdcAmount = (userBalance * token.realUsdcCollected) / token.totalSupply;
        require(usdcAmount > 0, "Payout is zero");

        tokenBalances[tokenId][msg.sender] = 0;
        token.totalSupply        -= userBalance;
        token.realUsdcCollected  -= usdcAmount;

        usdc.safeTransfer(msg.sender, usdcAmount);
        emit PayoutClaimed(tokenId, msg.sender, usdcAmount);
    }

    function getCurrentPrice(uint256 tokenId) external view tokenExists(tokenId) returns (uint256) {
        return _getCurrentPrice(_tokens[tokenId]);
    }

    function getToken(uint256 tokenId) external view tokenExists(tokenId) returns (TokenInfo memory) {
        return _tokens[tokenId];
    }

    function getTokenCount() external view returns (uint256) {
        return _tokenCount;
    }

    function updateFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Fee recipient is zero");
        address old = feeRecipient;
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(old, newFeeRecipient);
    }

    function updateCreationFee(uint256 newCreationFee) external onlyOwner {
        uint256 old = creationFee;
        creationFee = newCreationFee;
        emit CreationFeeUpdated(old, newCreationFee);
    }

    function _graduate(uint256 tokenId) internal {
        TokenInfo storage token = _tokens[tokenId];
        if (token.graduated) return;
        token.graduated = true;
        emit TokenGraduated(tokenId, token.realUsdcCollected);
    }

    function _getCurrentPrice(TokenInfo storage token) internal view returns (uint256) {
        if (token.virtualTokenReserve == 0) return type(uint256).max;
        return (token.virtualUsdcReserve * 1e6) / token.virtualTokenReserve;
    }
}
