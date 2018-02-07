import * as scopes from 'lib/constants/scopes'
import Organisation from 'lib/models/organisation'
import User from 'lib/models/user'

async function createAdmin(email, password, orgName) {
	let user = await new User({
		email,
		password,
		scopes: [scopes.SITE_ADMIN],
		verified: true,
	}).save()

	const org = await new Organisation({
		name: orgName,
		owner: user._id,
	}).save()

	user = await User.findOne({email})
	user.organisationSettings[0].scopes = [scopes.ALL]
	await user.save()
}

createAdmin('admin@cslearning.gov.uk', 'admin', 'CSL')
	.then(() => {
		console.log('>> Successfully created admin user')
		process.exit(0)
	})
	.catch(err => {
		console.log('>> ERROR:', err)
		process.exit(1)
	})
