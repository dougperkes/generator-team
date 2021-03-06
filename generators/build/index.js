const url = require(`url`);
const path = require(`path`);
const app = require(`./app`);
const util = require(`../app/utility`);
const generators = require(`yeoman-generator`);

function construct() {
   // Calling the super constructor is important so our generator is correctly set up
   generators.Base.apply(this, arguments);

   // Order is important 
   this.argument(`type`, { required: false, desc: `project type to create (asp, node or java)` });
   this.argument(`applicationName`, { required: false, desc: `name of the application` });
   this.argument(`tfs`, { required: false, desc: `full tfs URL including collection or Team Services account name` });
   this.argument(`queue`, { required: false, desc: `agent queue name to use` });
   this.argument(`target`, { required: false, desc: `docker or Azure app service` });
   this.argument(`dockerHost`, { required: false, desc: `Docker host url including port` });
   this.argument(`dockerRegistry`, { required: false, desc: `server of your Docker registry` });
   this.argument(`dockerRegistryId`, { required: false, desc: `username for Docker registry` });
   this.argument(`pat`, { required: false, desc: `Personal Access Token to TFS/VSTS` });
}

// Collect any missing data from the user.
function input() {
   // Collect any missing data from the user.
   // This gives me access to the generator in the
   // when callbacks of prompt
   let cmdLnInput = this;

   return this.prompt([{
      name: `tfs`,
      type: `input`,
      store: true,
      message: util.getInstancePrompt,
      validate: util.validateTFS,
      when: answers => {
         return cmdLnInput.tfs === undefined;
      }
   }, {
      name: `pat`,
      type: `password`,
      store: false,
      message: util.getPATPrompt,
      validate: util.validatePersonalAccessToken,
      when: answers => {
         return cmdLnInput.pat === undefined;
      }
   }, {
      name: `queue`,
      type: `list`,
      store: true,
      message: `What agent queue would you like to use?`,
      default: `Default`,
      choices: util.getPools,
      when: answers => {
         var result = cmdLnInput.queue === undefined;

         if (result) {
            cmdLnInput.log(`  Getting Agent Queues...`);
         }

         return result;
      }
   }, {
      name: `type`,
      type: `list`,
      store: true,
      message: `What type of application do you want to create?`,
      choices: util.getAppTypes,
      when: function () {
         return cmdLnInput.type === undefined;
      }
   }, {
      name: `applicationName`,
      type: `input`,
      store: true,
      message: `What is the name of your application?`,
      validate: util.validateApplicationName,
      when: function () {
         return cmdLnInput.applicationName === undefined;
      }
   }, {
      name: `target`,
      type: `list`,
      store: true,
      message: `Where would you like to deploy?`,
      choices: util.getTargets,
      when: function () {
         return cmdLnInput.target === undefined;
      }
   }, {
      name: `dockerHost`,
      type: `input`,
      store: true,
      message: `What is your Docker host url and port (tcp://host:2376)?`,
      validate: util.validateDockerHost,
      when: function (answers) {
         // If you pass in the target on the command line 
         // answers.target will be undefined so test cmdLnInput
         return (answers.target === `docker` || cmdLnInput.target === `docker`) && cmdLnInput.dockerHost === undefined;
      }
   }, {
      name: `dockerRegistry`,
      type: `input`,
      default: `https://index.docker.io/v1/`,
      store: true,
      message: `What is your Docker Registry URL?`,
      validate: util.validateDockerRegistry,
      when: answers => {
         return (answers.target === `docker` || cmdLnInput.target === `docker`) && cmdLnInput.dockerRegistry === undefined;
      }
   }, {
      name: `dockerRegistryId`,
      type: `input`,
      store: true,
      message: `What is your Docker Registry username (case sensitive)?`,
      validate: util.validateDockerHubID,
      when: function (answers) {
         return (answers.target === `docker` || cmdLnInput.target === `docker`) && cmdLnInput.dockerRegistryId === undefined;
      }
   }]).then(function (answers) {
      // Transfer answers (a) to global object (cmdLnInput) for use in the rest
      // of the generator
      // If the gave you a answer from the prompt use it. If not check the 
      // command line.  If that is blank for some return `` so code does not
      // crash with undefined later on.
      this.pat = util.reconcileValue(answers.pat, cmdLnInput.pat);
      this.tfs = util.reconcileValue(answers.tfs, cmdLnInput.tfs);
      this.type = util.reconcileValue(answers.type, cmdLnInput.type);
      this.queue = util.reconcileValue(answers.queue, cmdLnInput.queue);
      this.target = util.reconcileValue(answers.target, cmdLnInput.target);
      this.dockerHost = util.reconcileValue(answers.dockerHost, cmdLnInput.dockerHost, ``);
      this.dockerRegistry = util.reconcileValue(answers.dockerRegistry, cmdLnInput.dockerRegistry, ``);
      this.applicationName = util.reconcileValue(answers.applicationName, cmdLnInput.applicationName, ``);
      this.dockerRegistryId = util.reconcileValue(answers.dockerRegistryId, cmdLnInput.dockerRegistryId, ``);
   }.bind(this));
}

function configureBuild() {

   var done = this.async();

   var build = this.templatePath(app.getBuild(this));

   var args = {
      pat: this.pat,
      tfs: this.tfs,
      buildJson: build,
      queue: this.queue,
      target: this.target,
      appName: this.applicationName,
      project: this.applicationName
   };

   if (this.target === `docker`) {
      args.dockerHost = this.dockerHost;
      args.dockerRegistry = this.dockerRegistry;
      args.dockerRegistryId = this.dockerRegistryId;
   }

   app.run(args, this, done);
}

module.exports = generators.Base.extend({
   // The name `constructor` is important here
   constructor: construct,

   // 2. Where you prompt users for options (where you`d call this.prompt())
   prompting: input,

   // 5. Where you write the generator specific files (routes, controllers, etc)
   writing: configureBuild
});