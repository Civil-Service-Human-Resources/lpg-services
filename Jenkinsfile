pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                withNPM(npmrcConfig:'my-custom-npmrc') {
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
