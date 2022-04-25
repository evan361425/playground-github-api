export type TravisConfigBasic = {
  language: TravisConfigLanguage;
  os: TravisConfigOS[];
  dist: TravisConfigDist;
  arch?: TravisConfigArch[];
  osx_image?: string[];
  sudo?: boolean;
  env?: TravisConfigEnv;
  compiler?: TravisConfigCompiler[];
};

type TravisConfigOS = 'linux' | 'osx' | 'windows';
type TravisConfigDist =
  | 'trusty'
  | 'precise'
  | 'xenial'
  | 'bionic'
  | 'server-2016';
type TravisConfigArch = 'amd64' | 'arm64' | 'ppc64le' | 's390x';
type TravisConfigEnv = {
  jobs: TravisConfigEnvEntry[];
  global?: TravisConfigEnvEntry[];
  matrix?: TravisConfigEnvEntry[];
};
type TravisConfigEnvEntry = StringObject | TravisSecure;
type TravisConfigCompiler = 'clang' | 'gcc';
type TravisConfigLanguage =
  | 'android'
  | 'c'
  | 'clojure'
  | 'cpp'
  | 'crystal'
  | 'csharp'
  | 'd'
  | 'dart'
  | 'elixir'
  | 'elm'
  | 'erlang'
  | 'generic'
  | 'go'
  | 'groovy'
  | 'hack'
  | 'haskell'
  | 'haxe'
  | 'java'
  | 'julia'
  | 'nix'
  | 'node_js'
  | 'objective-c'
  | 'perl'
  | 'perl6'
  | 'php'
  | 'python'
  | 'r'
  | 'ruby'
  | 'rust'
  | 'scala'
  | 'shell'
  | 'smalltalk';

export type StringObject = {
  [key: string]: string;
};
export type TravisSecure = { secure: string };
