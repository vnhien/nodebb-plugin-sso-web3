'use strict';

/* globals document, web3, $ */

$(document).ready(() => {
	console.log('sso logic loaded')
	const mobileConnect = () => {
		localStorage.removeItem('walletconnect');
		require(['web3'], function(Web3){
			// console.log("Initializing example");
			// console.log("web3 is :", Web3 );
			// console.log("web3 modal is : ",window.Web3Modal);
			// console.log("evmChain is:", window.evmChains);
  			//console.log("WalletConnectProvider is", window.WalletConnectProvider);
  			// console.log("Fortmatic is", window.Fortmatic);
  			// console.log("window.web3 is", window.web3, "window.ethereum is", window.ethereum);
			console.log("web3 is :", Web3);
			const Web3Modal = window.Web3Modal.default;
			const WalletConnectProvider = window.WalletConnectProvider.default;
			walletConnectProvider = new WalletConnectProvider({
				rpc: {
					56: "https://bsc-dataseed.binance.org/"
				},
				network: 'binance',
			})
			//const Fortmatic = window.Fortmatic;
			//const evmChains = window.evmChains;
			const providerOptions = {
				walletconnect: {
				  package: WalletConnectProvider,
				  options: {
                    rpc: {
						56: "https://bsc-dataseed.binance.org/"
					},
					network: 'binance',				
                }
				}
			  };
			
			  web3Modal = new Web3Modal({
				cacheProvider: false, // optional
				providerOptions, // required
				disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
			  });
			  try {
				  		console.log(web3Modal);
						web3Modal.connect().then(async (provider)=>{							
							provider.on('disconnect',()=>{
								console.log('disconect!');
								provider = null;
							})
							console.log("web3modal connected!")
							window.web3 = new Web3(provider);
							console.log("closing...");
							localStorage.removeItem('walletconnect');
							//localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');						
							web3.eth.getAccounts().then(sign);
						}).catch((err)=>{
							console.log("not connected")
						});
					
			  } catch(e) {
				console.log("Could not get a wallet connection", e);
				return;
			  }
		});
	 }
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
		localStorage.removeItem('walletconnect');
		if (!accounts.length) {
			throw new Error('No accounts set up.');
		}
		
		const address = accounts[0];
		const message = config.termsOfUse ? config.termsOfUse : `Welcome to ${config.siteTitle || 'TravaForum'}`;

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
			.catch(err => { 
				console.log("not signed:",err);
				localStorage.removeItem('walletconnect'); 
			})
			.then(async (a) => {
				//console.log('here', a);
				a.json().then((data)=>{
					// console.log("response data:", data);
					if(data.isFirstLog){				
						window.localStorage.needUpdateInfo = 'true';
						window.location.pathname="/me/edit";
					}
					else{
						window.localStorage.welcomeUser = 'true';
						window.location.pathname="/";
						
					}
				});
				if (ajaxify.data.template.name === 'account/edit') {
					ajaxify.go(`${config.relative_path}/me/edit`);
				} else {
					window.location.reload();
				}
			}).catch(err => { 
				console.log("not signed:",err);
				localStorage.removeItem('walletconnect'); 
			});
		}).catch(err => { console.log(err); });
		
	}
	
	if (config.uid && config.requireEmailConfirmation && !app.user.email) {
		showWelcomeMessage();
	}
	
	
	$(window).on('action:ajaxify.end', () => {
		if (ajaxify.data.template.name === 'account/edit') {
			$('[data-component="web3/associate"]').on('click', authenticate);
			$('[data-component="web3/disassociate"]').on('click', deauthenticate);
			const b = window.localStorage.needUpdateInfo;
			if (b === 'true'){
				console.log('ok');
				app.alert({
					message: 'Please update your information',
					timeout: 4000
				})
				window.localStorage.needUpdateInfo = 'false';
			}
		}
		if (ajaxify.data.template.name === 'categories') {
			const a = window.localStorage.welcomeUser;
			console.log('welcome:', typeof a);
			if (a === 'true'){
				console.log('ok');
				app.alert({
					message: 'Welcome',
					timeout: 4000
				})
				window.localStorage.welcomeUser = 'false';
			}

			
		}	
		// console.log('setting event button');
		// $('#connect-login').on('click', function(){
		// 	console.log('okok');
		// 	mobileConnect();
		// })
		// console.log($('#connect-login'));
		// $('#mobile-menu').on('click',()=>{
		// 	$('#connect-login').on('click', function(){
		// 		console.log('okok');
		// 		mobileConnect();
		// 	})
		// })
		// console.log('action:ajaxify.end');
		// if (ajaxify.data.template.name === 'login') {
		// 	$('#connect-login').on('click',function(){
		// 		mobileConnect();
		// 	});
			
		// }
		$(document).on('click', '#connect-login, #login-to-post, #login-popular-tab, #login-recent-tab, #login-reply-button', function() {
			console.log('opening a modal');
			mobileConnect();
		})

	});
});
'use strict';

/* globals document, web3, $ */

$(document).ready(() => {
	console.log('sso logic loaded')
	const mobileConnect = () => {
		localStorage.removeItem('walletconnect');
		require(['web3'], function(Web3){
			// console.log("Initializing example");
			// console.log("web3 is :", Web3 );
			// console.log("web3 modal is : ",window.Web3Modal);
			// console.log("evmChain is:", window.evmChains);
  			//console.log("WalletConnectProvider is", window.WalletConnectProvider);
  			// console.log("Fortmatic is", window.Fortmatic);
  			// console.log("window.web3 is", window.web3, "window.ethereum is", window.ethereum);
			console.log("web3 is :", Web3);
			const Web3Modal = window.Web3Modal.default;
			const WalletConnectProvider = window.WalletConnectProvider.default;
			walletConnectProvider = new WalletConnectProvider({
				rpc: {
					56: "https://bsc-dataseed.binance.org/"
				},
				network: 'binance',
			})
			//const Fortmatic = window.Fortmatic;
			//const evmChains = window.evmChains;
			const providerOptions = {
				walletconnect: {
				  package: WalletConnectProvider,
				  options: {
                    rpc: {
						56: "https://bsc-dataseed.binance.org/"
					},
					network: 'binance',				
                }
				}
			  };
			
			  web3Modal = new Web3Modal({
				cacheProvider: false, // optional
				providerOptions, // required
				disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
			  });
			  try {
				  		console.log(web3Modal);
						web3Modal.connect().then(async (provider)=>{							
							provider.on('disconnect',()=>{
								console.log('disconect!');
								provider = null;
							})
							console.log("web3modal connected!")
							window.web3 = new Web3(provider);
							console.log("closing...");
							localStorage.removeItem('walletconnect');
							//localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');						
							web3.eth.getAccounts().then(sign);
						}).catch((err)=>{
							console.log("not connected")
						});
					
			  } catch(e) {
				console.log("Could not get a wallet connection", e);
				return;
			  }
		});
	 }
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
		localStorage.removeItem('walletconnect');
		if (!accounts.length) {
			throw new Error('No accounts set up.');
		}
		
		const address = accounts[0];
		const message = config.termsOfUse ? config.termsOfUse : `Welcome to ${config.siteTitle || 'TravaForum'}`;

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
			.catch(err => { 
				console.log("not signed:",err);
				localStorage.removeItem('walletconnect'); 
			})
			.then(async (a) => {
				//console.log('here', a);
				a.json().then((data)=>{
					// console.log("response data:", data);
					if(data.isFirstLog){				
						window.localStorage.needUpdateInfo = 'true';
						window.location.pathname="/me/edit";
					}
					else{
						window.localStorage.welcomeUser = 'true';
						window.location.pathname="/";
						
					}
				});
				if (ajaxify.data.template.name === 'account/edit') {
					ajaxify.go(`${config.relative_path}/me/edit`);
				} else {
					window.location.reload();
				}
			}).catch(err => { 
				console.log("not signed:",err);
				localStorage.removeItem('walletconnect'); 
			});
		}).catch(err => { console.log(err); });
		
	}
	
	if (config.uid && config.requireEmailConfirmation && !app.user.email) {
		showWelcomeMessage();
	}
	
	
	$(window).on('action:ajaxify.end', () => {
		if (ajaxify.data.template.name === 'account/edit') {
			$('[data-component="web3/associate"]').on('click', authenticate);
			$('[data-component="web3/disassociate"]').on('click', deauthenticate);
			const b = window.localStorage.needUpdateInfo;
			if (b === 'true'){
				console.log('ok');
				app.alert({
					message: 'Please update your information',
					timeout: 4000
				})
				window.localStorage.needUpdateInfo = 'false';
			}
		}
		if (ajaxify.data.template.name === 'categories') {
			const a = window.localStorage.welcomeUser;
			console.log('welcome:', typeof a);
			if (a === 'true'){
				console.log('ok');
				app.alert({
					message: 'Welcome',
					timeout: 4000
				})
				window.localStorage.welcomeUser = 'false';
			}

			
		}	
		// console.log('setting event button');
		// $('#connect-login').on('click', function(){
		// 	console.log('okok');
		// 	mobileConnect();
		// })
		// console.log($('#connect-login'));
		// $('#mobile-menu').on('click',()=>{
		// 	$('#connect-login').on('click', function(){
		// 		console.log('okok');
		// 		mobileConnect();
		// 	})
		// })
		// console.log('action:ajaxify.end');
		// if (ajaxify.data.template.name === 'login') {
		// 	$('#connect-login').on('click',function(){
		// 		mobileConnect();
		// 	});
			
		// }
		$(document).on('click', '#connect-login, #login-to-post, #login-popular-tab, #login-recent-tab, #login-reply-button', function() {
			console.log('opening a modal');
			mobileConnect();
		})

	});
});
