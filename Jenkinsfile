pipeline {
    agent any
    stages {
        stage('Test') {
        steps {
            sh 'cd test/performance'
            sh 'npm run smoke'
        }
    }
}