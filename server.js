const express = require('express');

require('svelte');
require('svelte/ssr/register');

function writePageWith(component){
    const Template = require('./dist/index.html');

    let temphtml = Template.render({
        app: component
    });

    return temphtml.html


}

const app = express();

app.use('/dist', express.static('dist'));

app.get('/find', (req, res) => {

    const find = require('./shared/Routes/Find.html');

    let html = writePageWith(find.render().html);
    res.send(html);

});

const port = process.env.PORT || 1234;
app.listen(port, () => {
  // eslint-disable-next-line no-console

  console.log(`Listening to port ${port}...`);
});
