'use strict';

/* globals document, web3, $ */

$(document).ready(() => {
	
	

	
	const getNounce = async function(address){
		fetch(`${config.relative_path}/nounce`, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			  },
			body: JSON.stringify({
				"address": address
			})
		}).catch((err)=> {
			app.alert({
				message: err,
				timeout: 3000
			})
		}).then((data)=>data.json()).then((re)=>re.nounce)
            
	}
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
						web3Modal.connect().then(async (provider)=>{							
							provider.on('disconnect',()=>{
								provider = null;
							})
							window.web3instance = new Web3(provider);
							localStorage.removeItem('walletconnect');
							//localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');						
							web3instance.eth.getAccounts().then(signMsg);
						}).catch((err)=>{
							app.alert({
								message: "Not connected",
								timeout: 3000
							})
						});
					
			  } catch(e) {
				app.alert({
					message: "Could not get a wallet connection: "+ e,
					timeout: 3000
				})
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
				web3.eth.getAccounts().then(signMsg);
			}, err => {
				throw new Error(err);
			});
		});
	};
	const signMsg = accounts => {
		if (!accounts.length) {
			throw new Error('No accounts set up.');
		}
		const userAddressData = accounts[0];
		fetch(`${config.relative_path}/nounce`, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			  },
			body: JSON.stringify({
				"address": userAddressData
			})
		}).catch((err)=> {
			app.alert({
				message: err,
				timeout: 3000
			})
		}).then(data => data.json()).then(nounceData => {
			const fixMsg = config.termsOfUse ? config.termsOfUse : `Welcome to 'TravaForum' `;
			const msgToSign = config.termsOfUse ? config.termsOfUse : `Welcome to 'TravaForum' ` + nounceData.nounce;
			// const msgToSign = `Welcome to 'TravaForum'` ;
			doSign(userAddressData, msgToSign, fixMsg);
		})
	}
	const deauthenticate = () => {	
		fetch(`${config.relative_path}/deauth/web3`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'x-csrf-token': config.csrf_token },
		}).then(() => {
			ajaxify.go(`${config.relative_path}/me/edit`);
		}).catch(err => { 
			app.alert({
				message: err,
				timeout: 3000
			})
		});
	};

	const doSign = (address, msgToSign, fixMsg) => {
		localStorage.removeItem('walletconnect');
		web3instance.eth.personal.sign(msgToSign, address).then(signed => {
			fetch(`${config.relative_path}/auth/web3`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-csrf-token': config.csrf_token },
				body: JSON.stringify({
					"address": address,
					"message": fixMsg,
					"signed": signed,
				}),
			})
			.catch(err => { 
				app.alert({
					message: err,
					timeout: 3000
				})
				localStorage.removeItem('walletconnect'); 
			})
			.then(async (a) => {
				a.json().then((data)=>{
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
				localStorage.removeItem('walletconnect'); 
			});
		}).catch(err => { 
			app.alert({
				message: err,
				timeout: 3000
			})
		 });
		
	}

	if (config.uid && config.requireEmailConfirmation && !app.user.email) {
		showWelcomeMessage();
	}
	
	
	$(window).on('action:ajaxify.end', () => {
		if (ajaxify.data.template.name === 'account/edit') {
			const b = window.localStorage.needUpdateInfo;
			if (b === 'true'){
				app.alert({
					message: 'Please update your information',
					timeout: 4000
				})
				window.localStorage.needUpdateInfo = 'false';
			}
		}
		if (ajaxify.data.template.name === 'categories') {
			const a = window.localStorage.welcomeUser;
			if (a === 'true'){
				app.alert({
					message: 'Welcome',
					timeout: 4000
				})
				window.localStorage.welcomeUser = 'false';
			}		
		}
		$(document).on('click', '#connect-login, #login-to-post, #login-popular-tab, #login-recent-tab, #login-reply-button', function() {
			mobileConnect();
		})
	});
});
