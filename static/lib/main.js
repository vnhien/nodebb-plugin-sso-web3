'use strict';

/* globals document, web3, $ */

$(document).ready(() => {
	
	const showWelcomeMessage = () => {
		if (ajaxify.data.template.name.startsWith('account')) {
			return;
		}

		$('#user_label').popover({
			content: `<p>Welcome, <strong>${app.user.username}</strong>!</p> <p>Click me to edit your profile. Please confirm your email address to fully activate your account.</p>`,
			placement: 'bottom',
			trigger: 'focus',
			viewport: '#content',
			html: true,
		}).popover('show');

		$('window, #user_label').one('click', function() {
			$('#user_label').popover('destroy');
		});
	}

	const authenticate = () => {
		require(['web3'], (Web3) => {
			window.web3 = new Web3(window.ethereum);
			window.ethereum.enable().then(() => {
				web3.eth.getAccounts().then(sign);
			}, err => {
				throw new Error(err);
			});
		});
	};

	const deauthenticate = () => {	
		fetch(`${config.relative_path}/deauth/web3`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'x-csrf-token': config.csrf_token },
		}).then(() => {
			ajaxify.go(`${config.relative_path}/me/edit`);
		}).catch(err => { console.log(err); });
	};

	const sign = accounts => {
		if (!accounts.length) {
			throw new Error('No accounts set up.');
		}
		
		const address = accounts[0];
		const message = config.termsOfUse ? config.termsOfUse : `Welcome to ${config.siteTitle || 'NodeBB'}`;

		web3.eth.personal.sign(message, address).then(signed => {
			console.log('signing!')
			console.log(config.relative_path);
			fetch(`${config.relative_path}/auth/web3`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-csrf-token': config.csrf_token },
				body: JSON.stringify({
					address: address,
					message: message,
					signed: signed,
				}),
			})
			.then(async (a) => {
				//console.log('here', a);
				a.json().then((data)=>{
					console.log("response data:", data);
					if(data.isFirstLog){
						window.location.pathname="/me/edit";
					}
					else{
						window.location.pathname="/";
					}
				});
				if (ajaxify.data.template.name === 'account/edit') {
					ajaxify.go(`${config.relative_path}/me/edit`);
				} else {
					// window.location.reload();
					//ajaxify.go(`${config.relative_path}/me/edit`)
					//window.location.reload();
				}
			}).catch(err => { console.log(err); });
		}).catch(err => { console.log(err); });
	}
	
	if (config.uid && config.requireEmailConfirmation && !app.user.email) {
		showWelcomeMessage();
	}

	// if (!config.uid && window.ethereum) {
	// 	authenticate();
	// }
	
	
	$(window).on('action:ajaxify.end', () => {
		if (ajaxify.data.template.name === 'account/edit') {
			$('[data-component="web3/associate"]').on('click', authenticate);
			$('[data-component="web3/disassociate"]').on('click', deauthenticate);
		}
		if (ajaxify.data.template.name === 'login') {
			console.log('login form loaded!');
			$('#connect-with-metamask').on('click',function(){
				authenticate();
				console.log('metamask connecting!');
			});
		}
	});
});
