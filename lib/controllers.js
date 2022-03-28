'use strict';

const controllers = {};
const nconf = require.main.require('nconf');
const deauth = require('./deauth');
const db = require.main.require('./src/database');
const user = require.main.require('./src/user');


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
controllers.getNounce = async (req, res ) => {
	var address = req.body.address;
	console.log(address);
	db.getObjectField('web3:address:uid', address, async (err, uid) => {
		if (err){
			res.json({
				err: err
			});
		}
		if(uid){
			var nounce = await user.getUserField(uid, 'nounce');
		console.log(nounce);
			res.json({
				err: 'false',
				nounce: nounce
			})
		}
		else{
			res.json({
				err: false,
				nounce: ''
			})
		}	
	})
}

module.exports = controllers;
