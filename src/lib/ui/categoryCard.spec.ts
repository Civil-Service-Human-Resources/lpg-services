import {expect} from 'chai'
import * as express from 'express'
import * as nunjucks from 'nunjucks'
import * as nunjucksMiddleware from './middleware/nunjucks'

describe('Category Card Macro tests', () => {
	let app: express.Express

	beforeEach(() => {
		app = express()
		nunjucksMiddleware.register(app)
	})

	it('should render the "View courses and links" anchor when courseCount > 0 and sub-topics exist', () => {
		const template = `
            {% from "nsg/components/categoryCard/macro.njk" import categoryCard %}
            {{ categoryCard({
                title: "Digital",
                url: "/categories/digital",
                courseCount: 1,
                linkCount: 0,
                categories: [{ href: "/categories/digital/data", text: "Data" }]
            }) }}
        `
		const rendered = nunjucks.renderString(template, {})

		expect(rendered).to.include('View Digital courses and links')
		expect(rendered).to.include('Topics')
		expect(rendered).to.include('Data')
	})

	it('should render the "View subjects" anchor when no direct courses or links exist', () => {
		const template = `
            {% from "nsg/components/categoryCard/macro.njk" import categoryCard %}
            {{ categoryCard({
                title: "Finance",
                url: "/categories/finance",
                courseCount: 0,
                linkCount: 0,
                categories: []
            }) }}
        `
		const rendered = nunjucks.renderString(template, {})

		expect(rendered).to.not.include('View Finance courses and links')
		expect(rendered).to.include('View subjects')
	})
})
