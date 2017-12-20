import 'svelte/ssr/register';
import 'svelte';
import 'fs';
import 'path';
import appStart from './../../components/AppStart.html';
import Search from './../../components/Search.html';


let template = fs.readFileSync( `${__dirname}/../client/index.html`, 'utf-8' );
const templateChunks = [];
const pattern = /__(\w+)__/g;
let match;
let c = 0;

while ( match = pattern.exec( template ) ) {
    templateChunks.push({
        type: 'static',
        content: template.slice( c, match.index )
    });

    templateChunks.push({
        type: 'dynamic',
        content: match[1]
    });

    c = match.index + match[0].length;
}

templateChunks.push({
    type: 'static',
    content: template.slice( c )
});
function serve ( res, data) {
    res.writeHead( 200, {
        'Content-Type': 'text/html'
    });

    let promise = Promise.resolve();
    templateChunks.forEach( chunk => {
        promise = promise.then( () => {
            if ( chunk.type === 'static' ) {
                res.write( chunk.content );
            }

            else {
                return Promise.resolve( data[ chunk.content ] ).then( content => {
                    res.write( content );
                });
            }
        });
    });

    return promise.then( () => {
        res.end();
    });
}





export default function middleware(req, res) {
    serve( res, {
        route: About.render()
    } );
    //res.send(Search.render().html)
//res.send(appStart.render({name: "world"}).html);
}


