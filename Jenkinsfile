pipeline {
    agent any
    stages {
        stage('Peformance Test') {
            steps { 
                nodejs(nodeJSInstallationName: 'NodeJS 10.4.0') {
                    sh 'cd test/performance'
                    sh 'npm install'
                    sh 'npm run smoke'
                }
            }
        }
    }
}