// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Travya Verification - Identity & verification proofs on Ethereum (Sepolia).
 * Stores only verification state; detailed user data stays off-chain (Supabase).
 */

contract TravyaVerification {
    struct Tourist {
        address walletAddress;
        string touristId;
        bool isRegistered;
        bool isVerified;
    }

    struct Group {
        string groupId;
        address headWallet;
        address[] memberWallets;
    }

    struct Local {
        address walletAddress;
        bool isRegistered;
        bool isVerified;
    }

    struct Police {
        address walletAddress;
        bool isAuthorized;
    }

    mapping(address => Tourist) public tourists;
    mapping(string => Group) public groups;
    mapping(address => Local) public locals;
    mapping(address => Police) public police;

    mapping(address => bool) private _authorizedPolice;

    event TouristRegistered(address indexed wallet, string touristId);
    event GroupCreated(string indexed groupId, address indexed headWallet);
    event MemberAdded(string indexed groupId, address indexed memberWallet);
    event LocalRegistered(address indexed wallet);
    event LocalVerified(address indexed localWallet);
    event PoliceRegistered(address indexed wallet);
    event TouristVerified(address indexed touristWallet);

    error AlreadyRegistered();
    error NotAuthorized();
    error GroupExists();
    error GroupNotFound();
    error NotGroupHead();

    function registerTourist(string calldata touristId) external {
        if (tourists[msg.sender].isRegistered) revert AlreadyRegistered();
        tourists[msg.sender] = Tourist({
            walletAddress: msg.sender,
            touristId: touristId,
            isRegistered: true,
            isVerified: false
        });
        emit TouristRegistered(msg.sender, touristId);
    }

    function verifyTourist(address touristWallet) external {
        if (!_authorizedPolice[msg.sender]) revert NotAuthorized();
        require(tourists[touristWallet].isRegistered, "Tourist not registered");
        tourists[touristWallet].isVerified = true;
        emit TouristVerified(touristWallet);
    }

    function createGroup(string calldata groupId) external {
        if (bytes(groups[groupId].groupId).length != 0) revert GroupExists();
        groups[groupId] = Group({
            groupId: groupId,
            headWallet: msg.sender,
            memberWallets: new address[](0)
        });
        emit GroupCreated(groupId, msg.sender);
    }

    function addGroupMember(string calldata groupId, address memberWallet) external {
        Group storage g = groups[groupId];
        if (bytes(g.groupId).length == 0) revert GroupNotFound();
        if (g.headWallet != msg.sender) revert NotGroupHead();
        g.memberWallets.push(memberWallet);
        emit MemberAdded(groupId, memberWallet);
    }

    function registerLocal() external {
        if (locals[msg.sender].isRegistered) revert AlreadyRegistered();
        locals[msg.sender] = Local({
            walletAddress: msg.sender,
            isRegistered: true,
            isVerified: false
        });
        emit LocalRegistered(msg.sender);
    }

    function verifyLocal(address localWallet) external {
        if (!_authorizedPolice[msg.sender]) revert NotAuthorized();
        require(locals[localWallet].isRegistered, "Local not registered");
        locals[localWallet].isVerified = true;
        emit LocalVerified(localWallet);
    }

    function registerPolice(address policeWallet) external {
        // In production, restrict to owner/admin; for Sepolia demo allow first caller to authorize
        if (police[policeWallet].isAuthorized) revert AlreadyRegistered();
        _authorizedPolice[policeWallet] = true;
        police[policeWallet] = Police({
            walletAddress: policeWallet,
            isAuthorized: true
        });
        emit PoliceRegistered(policeWallet);
    }

    // View helpers
    function getGroupMemberCount(string calldata groupId) external view returns (uint256) {
        return groups[groupId].memberWallets.length;
    }
}
