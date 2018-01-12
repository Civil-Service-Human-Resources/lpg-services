import { init } from 'sapper/runtime.js';
//import { init as initAuth } from '../routes/_auth.js';
import './../assets/styles/index.scss';

// initAuth().then(() => {
//
// });

init(document.querySelector('#sapper'), __routes__);

