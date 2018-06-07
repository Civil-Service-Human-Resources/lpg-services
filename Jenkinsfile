pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS 10.4.0') {
                    sh 'npm install'
                    sh 'npm run lint'
                    sh 'npm run lint:webdriver'
                    sh 'npm run build'
                    sh 'npm test'
                }
            }
        }
    }
}
