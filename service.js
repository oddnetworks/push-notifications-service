// const cryo = require('cryo');
const Promise = require('bluebird');
const redis = require('redis');
const config = require('./config.js');
Promise.promisifyAll(redis);

const DeviceRegistration = require('./routes/device-tokens.js');
const Pushem = require('./routes/pushem.js');
// const PlatformApplication = require('./routes/application.js');

const ROLE = 'notifications';

exports.initialize = (bus, options) => {
	console.log('Notification Service Initialized');
	const aws = options.aws;
	aws.config.update(config.aws);
	const sns = new aws.SNS();

	bus.queryHandler({role: ROLE, cmd: 'registerDevice'}, payload => {
		const organizationTopicArn = payload.organizationTopicArn; // eslint-disable-line
		const applicationTopicArn 	= payload.applicationTopicArn;
		const applicationArn 		= payload.applicationArn;
		const deviceToken 			= payload.deviceToken;

		console.log(`Service adding device to ${applicationArn}, of the ${organizationTopicArn} organization with device code: ${deviceToken}`);
		return DeviceRegistration.createPlatformEndpoint(organizationTopicArn, applicationTopicArn, applicationArn, deviceToken, sns)
			.then(device => {
				return device;
			});
	});

	bus.queryHandler({role: ROLE, cmd: 'notifyOrganization'}, payload => {
		const organizationTopicArn = payload.organizationTopicArn;
		const message					= payload.message;

		return Pushem.notify(organizationTopicArn, message, sns)
			.then(notification => {
				return notification;
			});
	});

	bus.queryHandler({role: ROLE, cmd: 'notifyApplication'}, payload => {
		const applicationTopicArn 	= payload.applicationTopicArn;
		const message					= payload.message;

		return Pushem.notify(applicationTopicArn, message, sns)
			.then(notification => {
				return notification;
			});
	});

};

// exports.middleware = require('./middleware');
exports.router = require('./routes/router.js');
