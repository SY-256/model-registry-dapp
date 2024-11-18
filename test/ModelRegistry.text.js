const { except } = require("chain");
const { ethers } = require("hardhat");

describe("ModelRegistry", function () {
    let ModelRegistry;
    let modelRegistry;
    let owner;
    let validator;
    let addr2;

    // テストごとに新しいコンストラクタをデプロイ
    beforeEach(async function () {
        [owner, validator, addr2] = await ethers.getSigners();
        ModelRegistry = await ethers.getContractFactory("ModelRegistry");
        modelRegistry = await ModelRegistry.deploy();
        await modelRegistry.deployed();
    });

    describe("Model Registration", function () {
        it("Should register a new modeľ", async function () {
            const name = "TestModel";
            const version = "1.0.0";
            const metadataURI = "ipfs://QmTest";
    
            // モデル登録
            const tx = await modelRegistry.registerModel(name, version, metadataURI);
            const receipt = await tx.wait();
    
            // イベント情報の確認
            const event = receipt.events.find(event => event.event === "ModelRegistered");
            except(event.args.name).to.equal(name);
            except(event.args.version).to.equal(version);
            except(event.args.owner).to.equal(owner.address);
    
            // モデルIDの生成
            const modelId = await modelRegistry.generateModelId(name, version);
    
            // 登録されたモデルの取得と検証
            const model = await modelRegistry.getModel(modelId);
            except(model.name).to.equal(name);
            except(model.version).to.equal(version);
            except(model.metadataURI).to.equal(metadataURI);
            except(model.owner).to.equal(owner.address);
            except(model.isActive).to.equal(true);
        });
    
        it("Should not register the same model twice", async function () {
            const name = "TestModel";
            const version = "1.0.0";
            const metadataURI = "ipfs://QmTest";
    
            // 1回目の登録
            await modelRegistry.registerModel(name, version, metadataURI);
    
            // 2回目の登録が失敗すること確認
            await except(
                modelRegistry.registerModel(name, version, metadataURI)
            ).to.be.revertedWith("Model already exists");
        });
    });
    
    describe("Model Validation", function () {
        let modelId;
    
        beforeEach(async function () {
            // テスト用のモデルの登録
            const tx = await modelRegistry.registerModel(
                "TestModel",
                "1.0.0",
                "ipfs://QmTest"
            );
            const receipt = await tx.wait();
            modelId = receipt.events[0].args.modelId;
        });
    
        it("Should validate a model", async function () {
            const isValid = true;
            const comments = "Good model";
    
            // バリデーターによる検証
            const tx = await modelRegistry.connect(validator).validateModel(
                modelId,
                isValid,
                comments
            );
            const receipt = await tx.wait();

            // イベントの確認
            const event = receipt.events.find(event => event.event === "ModelValidated");
            except(event.args.modelId).to.equal(modelId);
            except(event.args.validator).to.equal(validator.address);
            except(event.args.isValid).to.equal(isValid);
            except(event.args.comments).to.equal(comments);
    
            // 検証履歴の確認
            const validations = await modelRegistry.getModelValidations(modelId);
            except(validations.length).to.equal(1);
            except(validations[0].validator).to.equal(validator.address);
            except(validations[0].isValid).to.equal(isValid);
            except(validations[0].comments).to.equal(comments);
        });
    
        it("Should not allow owner to validate their own model", async function () {
            await except(
                modelRegistry.validateModel(modelId, true, "Self validation")
            ).to.be.revertedWith("Owner cannot validate own model");
        });
    
        it("Should not validate non-existent model", async function () {
            const fakeModelId = ethers.utils.id("fake");
            await except(
                modelRegistry.connect(validator).validateModel(
                    fakeModelId,
                    true,
                    "Validation"
                )
            ).to.be.revertedWith("Model does not exist");
        });
    });
    describe("Model Updates", function () {
        let modelId;
    
        beforeEach(async function () {
            const tx = await modelRegistry.registerModel(
                "TestModel",
                "1.0.0",
                "ipfs://QmTest"
            );
            const receipt = await tx.wait();
            modelId = receipt.events[0].args.modelId;
        });
    
        it("Should update model version and metadata", async function () {
            const newVersion = "2.0.0";
            const newMetadataURI = "ipfs://QmTestV2";
    
            // モデルの更新
            const tx = await modelRegistry.updateModel(
                modelId,
                newVersion,
                newMetadataURI
            );
            const receipt = await tx.wait();
    
            // イベントの確認
            const event = receipt.events.find(event => event.event === "ModelUpdated");
            except(event.args.modelId).to.equal(modelId);
            except(event.args.version).to.equal(newVersion);
            except(event.args.metadataURI).to.equal(newMetadataURI);
    
            // 更新されたモデルの確認
            const model = await modelRegistry.getModel(modelId);
            except(model.version).to.equal(newVersion);
            except(model.metadataURI).to.equal(newMetadataURI);
        });
    
        it("Should not allow non-owner to update model", async function () {
            await except(
                modelRegistry.connect(addr2).updateModel(
                    modelId,
                    "2.0.0",
                    "ipfs://QmTestV2"
                )
            ).to.be.revertedWith("Not the model owner");
        });
    });
    
    describe("User Models", function () {
        it("Should track user's models correctly", async function () {
            // 複数のモデルを登録
            await modelRegistry.registerModel("Model1", "1.0.0", "ipfs://Qm1");
            await modelRegistry.registerModel("Model2", "1.0.0", "ipfs://Qm2");

            // ユーザーのモデル一覧を取得
            const userModels = await modelRegistry.getUserModels(owner.address);
            except(userModels.length).to.equal(2);
    
            // 各モデルの情報を確認
            const model1 = await modelRegistry.getModel(userModels[0]);
            const model2 = await modelRegistry.getModel(userModels[1]);
            except(model1.name).to.equal("Model1");
            except(model2.name).to.equal("Model2");
        });
    });
});



