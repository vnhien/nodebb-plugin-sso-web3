'use strict';

const controllers = {};
const nconf = require.main.require('nconf');
const deauth = require('./deauth');
const winston = require.main.require('winston');
const user = require.main.require('./src/user');
const db = require.main.require('./src/database');

controllers.renderAdminPage = async (req, res) => {
	res.render('admin/plugins/sso/web3', {});
};

controllers.renderDeauth = async (req, res) => {
	res.render('plugins/sso-web3/deauth', {
		service: 'Web3',
	});
};

controllers.deauth = async (req, res) => {
	await deauth.deleteUserData({ uid: req.user.uid });
	res.redirect(nconf.get('relative_path') + '/me/edit');
};
controllers.getNounce = async (req, res) => {
	const userAddress = req.body.address;
	console.log('body:', req.body);
	db.getObjectField('web3:address:uid', userAddress, async (err, uid) => {
		if(err){
			res.send({
				errormessage : err
			});
		}
		if(uid){
			const nounce = await user.getUserField(uid, 'nounce');
			if(nounce){
				res.send({
					nounce: nounce
				});
			}
			res.send({
				nounce: ""
			});
			
		}
			res.send({
				nounce: ""
			});	
	});
}

module.exports = controllers;
