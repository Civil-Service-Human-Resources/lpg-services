import 'svelte/ssr/register';
import 'svelte';
import fs from 'fs';
import 'path';
import Search from './../../components/Search.html';
import Template from './../client/index.html';

let template = fs.readFileSync( `${__dirname}/../client/index.html`, 'utf-8' );



function writePageWith(renderedComponents){
    var appParts;
    renderedComponents.forEach(function(component){
        appParts += component.toString()
    });

    const temphtml = Template.render({
        app: appParts
    });

    return temphtml


}




export default function middleware(req, res) {


    const app = writePageWith([Search.render().html, Search.render().html]);
    res.send(app.html);

}


