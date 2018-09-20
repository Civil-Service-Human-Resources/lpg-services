pipeline {
    agent any

    triggers {
        cron(env.BRANCH_NAME == 'master' ? '@nightly' : '')
    }

    environment{
        ENV_PROFILE='test'
    }

    stages {
        stage('Peformance Test') {
            steps { 
                nodejs(nodeJSInstallationName: 'NodeJS 10.4.0') {
                    dir('test/performance') {
                        sh 'npm install'
                        sh 'npm run smoke'
                        sh 'npm run report'
                        publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: false, reportDir: 'reports', reportFiles: 'report.json.html', reportName: 'Performance Report', reportTitles: ''])
                    }
                }
            }
        }
    }
}