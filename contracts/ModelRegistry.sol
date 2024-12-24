// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract ModelRegistry {
    // モデルの構造体
    struct Model {
        string name;
        string version;
        string metadataURI;
        address owner;
        uint256 timestamp;
        bool isActive;
    }

    // モデルの検証情報の構造体
    struct ValidationInfo {
        address validator;
        uint256 timestamp;
        bool isValid;
        string comments;
    }

    // ストレージ
    mapping(bytes32 => Model) public models;
    mapping(bytes32 => ValidationInfo[]) public validations;
    mapping(address => bytes32[]) public userModels;
    uint256 public modelCount;

    // イベント
    event ModelRegistered(
        bytes32 indexed modelId,
        string name,
        string version,
        address indexed owner
    );

    event ModelValidated(
        bytes32 indexed modelId,
        address indexed validator,
        bool isValid,
        string comments
    );

    event ModelUpdated(
        bytes32 indexed modelId,
        string version,
        string metadataURI
    );

    // モディファイア
    modifier onlyModelOwner(bytes32 modelId) {
        require(models[modelId].owner == msg.sender, "Not the model owner");
        _;
    }

    // モデルIDを生成する関数
    function generateModelId(string memory name, string memory version) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(name, version));
    }

    // モデルを登録する関数
    function registerModel(
        string memory name,
        string memory version,
        string memory metadataURI
    ) public returns (bytes32) {
        bytes32 modelId = generateModelId(name, version);
        require(models[modelId].timestamp == 0, "Model already exists");

        models[modelId] = Model({
            name: name,
            version: version,
            metadataURI: metadataURI,
            owner: msg.sender,
            timestamp: block.timestamp,
            isActive: true
        });

        userModels[msg.sender].push(modelId);
        modelCount++;

        emit ModelRegistered((modelId), name, version, msg.sender);
        return modelId;
    }

     // モデル情報を更新する関数
    function updateModel(
        bytes32 modelId,
        string memory newVersion,
        string memory newMetadataURI
    ) public onlyModelOwner(modelId) {
        Model storage model = models[modelId];
        model.version = newVersion;
        model.metadataURI = newMetadataURI;
        model.timestamp = block.timestamp;

        emit ModelUpdated(modelId, newVersion, newMetadataURI);
    }

    // モデルを検証する関数
    function validateModel(
        bytes32 modelId,
        bool isValid,
        string memory comments
    ) public {
        require(models[modelId].timestamp > 0, "Model does not exist");
        require(models[modelId].owner != msg.sender, "Owner cannot validate own model");

        ValidationInfo memory validation = ValidationInfo({
            validator: msg.sender,
            timestamp: block.timestamp,
            isValid: isValid,
            comments: comments
        });

        validations[modelId].push(validation);

        emit ModelValidated(modelId, msg.sender, isValid, comments);
    }

    // モデル情報を取得する関数
    function getModel(bytes32 modelId) public view returns (Model memory) {
        require(models[modelId].timestamp > 0, "Model does not exist");
        return models[modelId];
    }

    // モデルの検証情報を取得する関数
    function getModelValidations(bytes32 modelId) public view returns (ValidationInfo[] memory) {
        return validations[modelId];
    }

    // ユーザーのモデル一覧を取得する関数
    function getUserModels(address user) public view returns (bytes32[] memory) {
        return userModels[user];
    }
}
