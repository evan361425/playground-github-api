type CodeBuildConfigPhase = {
  'run-as'?: string;
  'on-failure'?: 'ABORT' | 'CONTINUE';
  commands: string[];
  finally?: string[];
};

export type CodeBuildConfigPhases = {
  install: CodeBuildConfigPhase & {
    'runtime-versions'?: {
      [key: string]: string;
    };
    commands?: string[]; // optional
  };
  pre_build: CodeBuildConfigPhase;
  build: CodeBuildConfigPhase;
  post_build: CodeBuildConfigPhase;
};
