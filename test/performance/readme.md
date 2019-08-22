# Performance testing on LPG
## Overview
We use a tool called [Artillery](https://artillery.io/docs/) to execute performance/load tests against our application.

## Getting started
To run the performance test, you'll need to update the _target_ and _identityUrl_ variables accordingly per your environment.

You will also need to adjust the values for _duration_ and _arrival count_ to suit your kind of test. The current config loads 500 users over 1500s.

The tests will use the users defined in `users.csv`. These will need to be created in the identity/csrs databases of your respective environment before running. It's worth noting that Artillery seems to use these users in a _round robin_ sequence in that it will loop back to the start. In theory, you could just provide it a single set of log in credentials and it just use that repeatedly.

The script can be executed using the following command:  
`artillery run smoke.yml`

To export results to a report:  
`artillery run -o ../reports/report20190822.json smoke.yml`

## Next steps
- Add environment config to mean user doesnt have to hardcode env urls
- Set up defined phases of load
- Update CI/CD process to run perf tests against a dedicated environment (currently, these just outputs out the npm version)