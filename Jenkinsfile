#!/usr/bin/groovy

def project = "expenseManagerFrontend"
def version = -1
def imageName = "expense-manager-frontend"

node {
    stage('Checkout') {
        sh '''
            if [ ! -d .git ]; then
                git init
                git remote add origin git@github.com:cjmason8/expense-manager-frontend.git
            fi
            git fetch origin
            git checkout -f -B main origin/main
            git reset --hard origin/main
            git clean -fd
        '''
    }

    stage('Update Version') {
        sh './updateVersion.sh'

        version = readFile('VERSION').trim()
    }

    stage('Build') {
        sh "./build.sh $imageName $version"
    }

    stage('Tag and Push') {
        sh "./tagAndPush.sh $imageName $version"
    }

    stage('Deploy') {
        withCredentials([usernamePassword(credentialsId: 'Rancher', passwordVariable: 'SECRETKEY', usernameVariable: 'ACCESSKEY')]) {
            sh './deploy.sh $ACCESSKEY $SECRETKEY http://161.97.133.187:8080/v2-beta/projects/1a5 prod'
        }
    }
}
