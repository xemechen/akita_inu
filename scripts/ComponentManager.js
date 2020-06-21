var sshComponent = require('./SSH_Component'),
	amazonJpComponent = require('./AmazonJp_Component');

var getAllComponents = function(){
	return [
		sshComponent,
		amazonJpComponent
	];	
};

module.exports.getAllComponents = getAllComponents;