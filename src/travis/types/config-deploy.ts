export type TravisSharedDeploy = {
  provider: TravisProviders;
  cleanup?: boolean;
  edge?:
    | {
        branch?: string;
        source?: string;
      }
    | boolean;
  [key: string]: unknown; //TODO:
};

export type TravisProviders =
  | 'anynines'
  | 'cloudformation' //AWS CLOUDFORMATION
  | 'codedeploy' //AWS CODEDEPLOY
  | 'elasticbeanstalk' //AWS ELASTIC BEANSTALK
  | 'lambda' //AWS LAMBDA
  | 'opsworks' //AWS OPSWORKS
  | 's3' //AWS S3
  | 'azure_web_apps' //AZURE WEB APPS
  | 'bintray'
  | 'bluemixcloudfoundry' //BLUEMIX CLOUDFOUNDRY
  | 'boxfuse'
  | 'cargo'
  | 'chef_supermarket' //CHEF SUPERMARKET
  | 'cloud66' //CLOUD 66
  | 'cloudfoundry' //CLOUD FOUNDRY
  | 'convox'
  | 'datica'
  | 'engineyard' //ENGINE YARD
  | 'pages:git' //GITHUB PAGES
  | 'releases' //GITHUB RELEASES
  | 'gleis'
  | 'gae' //GOOGLE APP ENGINE
  | 'gcs' //GOOGLE CLOUD STORAGE
  | 'firebase' //GOOGLE FIREBASE
  | 'hackage'
  | 'hephy'
  | 'heroku:git' //HEROKU
  | 'launch' //LAUNCHPAD
  | 'npm'
  | 'netlify' //NETLIFY DROP
  | 'openshift' //OPENSHIFT
  | 'packagecloud' //PACKAGECLOUD
  | 'puppetforge' //PUPPET FORGE
  | 'pypi'
  | 'cloudfiles' //RACKSPACE CLOUD FILES
  | 'rubygems' //RUBYGEMS
  | 'scalingo' //SCALINGO
  | 'script' //SCRIPT
  | 'snap' //SNAP STORE
  | 'surge' //SURGE.SH
  | 'testfairy' //TESTFAIRY
  | 'transifex'; //TRANSIFEX
