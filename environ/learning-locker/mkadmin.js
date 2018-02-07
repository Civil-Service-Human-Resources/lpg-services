import * as scopes from 'lib/constants/scopes'
import Client from 'lib/models/client'
import LRS from 'lib/models/lrs'
import Organisation from 'lib/models/organisation'
import User from 'lib/models/user'

async function createAdmin(email, password, orgName) {
	let user = await User.findOne({email})
	if (!user) {
		user = await new User({
			email,
			password,
			scopes: [scopes.SITE_ADMIN],
			verified: true,
		}).save()
	}

	let org = await Organisation.findOne({name: orgName})
	if (!org) {
		org = await new Organisation({
			name: orgName,
			owner: user._id,
		}).save()
	}

	user = await User.findOne({email})
	if (!user.organisationSettings[0].scopes.length) {
		user.organisationSettings[0].scopes = [scopes.ALL]
		await user.save()
	}

	const lrsTitle = `${orgName} Store`

	let lrs = await LRS.findOne({title: lrsTitle})
	if (!lrs) {
		lrs = await new LRS({
			organisation: org._id,
			owner_id: user._id,
			title: lrsTitle,
		}).save()
	}

	const client = await Client.findOne({lrs_id: lrs._id})
	client.api = {
		basic_key: '66f2b4fc001e3da992d23b57d8a7457655bea078',
		basic_secret: '1c0e1b6827606d7efed71e204939d048f94f842b',
	}
	await client.save()
}

createAdmin('admin@cslearning.gov.uk', 'admin', 'LPG')
	.then(() => {
		console.log('>> Successfully created admin user')
		process.exit(0)
	})
	.catch(err => {
		console.log('>> ERROR:', err)
		process.exit(1)
	})
