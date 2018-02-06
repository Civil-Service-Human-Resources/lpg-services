
if(OBJ_NAV_BUTTONS && OBJ_NAV_BUTTONS["extra-accessible"] && OBJ_NAV_BUTTONS["extra-accessible"].booDefaultDisplayButton) OBJ_NAV_BUTTONS["extra-accessible"].booDefaultDisplayButton = false;
if(OBJ_NAV_BUTTONS && OBJ_NAV_BUTTONS["extra-credits"] && OBJ_NAV_BUTTONS["extra-credits"].booDefaultDisplayButton) OBJ_NAV_BUTTONS["extra-credits"].booDefaultDisplayButton = false;
if(OBJ_NAV_BUTTONS && OBJ_NAV_BUTTONS["extra-resources"] && OBJ_NAV_BUTTONS["extra-resources"].booDefaultDisplayButton) OBJ_NAV_BUTTONS["extra-resources"].booDefaultDisplayButton = false;
if(OBJ_NAV_BUTTONS && OBJ_NAV_BUTTONS["extra-language-selector"] && OBJ_NAV_BUTTONS["extra-language-selector"].booDefaultDisplayButton) OBJ_NAV_BUTTONS["extra-language-selector"].booDefaultDisplayButton = false;
if(OBJ_NAV_BUTTONS && OBJ_NAV_BUTTONS["extra-settings"] && OBJ_NAV_BUTTONS["extra-settings"].booDefaultDisplayButton) OBJ_NAV_BUTTONS["extra-settings"].booDefaultDisplayButton = false;
if(OBJ_NAV_BUTTONS && OBJ_NAV_BUTTONS["extra-search"] && OBJ_NAV_BUTTONS["extra-search"].booDefaultDisplayButton) OBJ_NAV_BUTTONS["extra-search"].booDefaultDisplayButton = false;
if(OBJ_NAV_BUTTONS && OBJ_NAV_BUTTONS["extra-jlr-menu"] && OBJ_NAV_BUTTONS["extra-jlr-menu"].booDefaultDisplayButton) OBJ_NAV_BUTTONS["extra-jlr-menu"].booDefaultDisplayButton = false;

var host = window.location.origin;
var path = window.location.pathname.replace('/do/', '/xapi');

BOO_INCLUDE_EXIT_ON_NAV = false;
BOO_INCLUDE_ACCESSIBLE_ON_NAV = false;
CLOSE_METHOD = 'csl';

var CONTENT_TRACKING_CONFIG = {
    enabled: true,
    pollingInterval: 60000,
    stores: [
        {
            adapter: 'tincan',
            version: '1.0',
            username: 'someone',
            password: 'somewhere',
            endpoint: host + path
        }
    ]
}
