// contracts/ModelRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract ModelRegistry {
   struct Model {
       string name;
       string version;
       string metadataURI;
       address owner;
       uint256 timestamp;
       bool isActive;
   }

   struct ValidationInfo {
       address validator;
       uint256 timestamp;
       bool isValid;
       string comments;
   }

   // モデルIDを保存する配列を追加
   bytes32[] public modelIds;

   mapping(bytes32 => Model) public models;
   mapping(bytes32 => ValidationInfo[]) public validations;
   mapping(address => bytes32[]) public userModels;

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

   modifier onlyModelOwner(bytes32 modelId) {
       require(models[modelId].owner == msg.sender, "Not the model owner");
       _;
   }

   function generateModelId(string memory name, string memory version) public pure returns (bytes32) {
       return keccak256(abi.encodePacked(name, version));
   }

   function registerModel(
       string memory name,
       string memory version,
       string memory metadataURI
   ) public returns (bytes32) {
       bytes32 modelId = generateModelId(name, version);
       require(models[modelId].timestamp == 0, "Model already exists");

       // モデルIDを配列に追加
       modelIds.push(modelId);
       
       models[modelId] = Model({
           name: name,
           version: version,
           metadataURI: metadataURI,
           owner: msg.sender,
           timestamp: block.timestamp,
           isActive: true
       });

       userModels[msg.sender].push(modelId);
       
       emit ModelRegistered(modelId, name, version, msg.sender);
       return modelId;
   }

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

   function getModel(bytes32 modelId) public view returns (Model memory) {
       require(models[modelId].timestamp > 0, "Model does not exist");
       return models[modelId];
   }

   function getModelValidations(bytes32 modelId) public view returns (ValidationInfo[] memory) {
       return validations[modelId];
   }

   function getUserModels(address user) public view returns (bytes32[] memory) {
       return userModels[user];
   }

   // すべてのモデルIDを取得する関数を追加
   function getAllModelIds() public view returns (bytes32[] memory) {
       return modelIds;
   }
}