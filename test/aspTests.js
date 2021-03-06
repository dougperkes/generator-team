const path = require(`path`);
const sinon = require(`sinon`);
const helpers = require(`yeoman-test`);
const assert = require(`yeoman-assert`);

describe(`team:asp docker`, () => {
   var spawnStub;

   before(() => {
      return helpers.run(path.join(__dirname, `../generators/asp/index`))
         .withArguments([`aspUnitTest`, `false`, `docker`, `tcp://23.1.1.1:2376`])
         .on(`error`, e => {
            assert.fail(e);
         })
         .on(`ready`, generator => {
            // This is called right before `generator.run()` is called
            // Stub the calls to spawnCommandSync
            spawnStub = sinon.stub(generator, `spawnCommandSync`);
         });
   });

   it(`bower install should not be called`, () => {
      assert.equal(0, spawnStub.withArgs(`bower`, [`install`], { stdio: ['pipe', 'pipe', process.stderr] }).callCount, `bower install was called`);
   });

   it(`dotnet restore should not be called`, () => {
      assert.equal(0, spawnStub.withArgs(`dotnet`, [`install`], { stdio: ['pipe', 'pipe', process.stderr] }).callCount, `dotnet restore was called`);
   });

   it(`files should be generated`, () => {
      assert.file([
         `aspUnitTest/.bowerrc`,
         `aspUnitTest/README.md`,
         `aspUnitTest/.gitignore`,
         `aspUnitTest/bower.json`,
         `aspUnitTest/global.json`,
         `aspUnitTest/src/aspUnitTest/web.config`,
         `aspUnitTest/src/aspUnitTest/Dockerfile`,
         `aspUnitTest/src/aspUnitTest/project.json`,
         `aspUnitTest/src/aspUnitTest/appsettings.json`
      ]);

      assert.fileContent(`aspUnitTest/bower.json`, `"name": "aspunittest"`);
      assert.fileContent(`aspUnitTest/src/aspUnitTest/Dockerfile`, `ENTRYPOINT dotnet aspUnitTest.dll`);
      assert.fileContent(`aspUnitTest/src/aspUnitTest/project.json`, `"defaultNamespace": "aspUnitTest"`);
   });
});

describe(`team:asp paas`, () => {
   var bowerStub;

   before(() => {
      return helpers.run(path.join(__dirname, `../generators/asp/index`))
         .withArguments([`aspUnitTest`, `true`, `paas`])
         .on(`error`, e => {
            assert.fail(e);
         })
         .on(`ready`, generator => {
            // This is called right before `generator.run()` is called
            // Stub the calls to spawnCommandSync
            bowerStub = sinon.stub(generator, `spawnCommandSync`);
         });
   });

   it(`bower install should be called`, () => {
      // Make sure the calls to install were made
      assert(bowerStub.withArgs(`bower`, [`install`], { stdio: ['pipe', 'pipe', process.stderr] }).calledOnce, `bower install not called once`);
   });

   it(`dotnet restore should be called`, () => {
      // Make sure the calls to install were made
      assert(bowerStub.withArgs(`dotnet`, [`restore`], { stdio: ['pipe', 'pipe', process.stderr] }).calledOnce, `dotnet restore not called once`);
   });

   it(`files should be generated`, () => {
      assert.file([
         `.bowerrc`,
         `README.md`,
         `.gitignore`,
         `./bower.json`,
         `./global.json`,
         `./templates/website.json`,
         `./templates/parameters.xml`,
         `./src/aspUnitTest/web.config`,
         `./src/aspUnitTest/Dockerfile`,
         `./src/aspUnitTest/project.json`,
         `./src/aspUnitTest/appsettings.json`,
         `./templates/website.parameters.json`
      ]);

      assert.fileContent(`./bower.json`, `"name": "aspunittest"`);
      assert.fileContent(`./templates/website.json`, `"name": "appsettings"`);
      assert.fileContent(`./src/aspUnitTest/Dockerfile`, `ENTRYPOINT dotnet aspUnitTest.dll`);
      assert.fileContent(`./src/aspUnitTest/project.json`, `"defaultNamespace": "aspUnitTest"`);
   });
});