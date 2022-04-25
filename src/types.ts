export type searchParameters = {
  q: string;
  sort?: 'author-date' | 'committer-date' | 'indexed';
  order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
};

export type metadataInfo = {
  repo_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_encoding: string;
  file_urls: {
    api: string;
    git: string;
    html: string;
    download: string;
  };
  repo_id: number;
  repo_description: string;
};

export type branchInfo = {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
};

export type protectionInfo = {
  url: string;
  required_status_checks: {
    url: string;
    strict: boolean;
    contexts: string[];
    contexts_url: string;
    enforcement_level?: 'non_admins';
  };
  restrictions: {
    url: string;
    users_url: string;
    teams_url: string;
    apps_url: string;
    users: userInfo[];
    teams: teamInfo[];
    apps: appInfo[];
  };
  required_pull_request_reviews: {
    url: string;
    dismiss_stale_reviews: boolean;
    require_code_owner_reviews: boolean;
    required_approving_review_count?: number;
    dismissal_restrictions?: dismissalRestrictionInfo;
  };
  enforce_admins: {
    url: string;
    enabled: boolean;
  };
  required_linear_history: {
    enabled: boolean;
  };
  allow_force_pushes: {
    enabled: boolean;
  };
  allow_deletions: {
    enabled: boolean;
  };
  required_conversation_resolution?: {
    enabled: boolean;
  };
};

export type contentInfo = {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file';
  content: string;
  encoding: 'base64';
  _links: {
    self: string;
    git: string;
    html: string;
  };
};

export type responseInfo = {
  total_count: number;
  incomplete_results: boolean;
  items: itemInfo[];
};

export type itemInfo = {
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  score: number;
  repository: repoInfo;
  file_name: string;
  status: 'finish' | 'ignored';
  [key: string]: unknown;
};

export type repoInfo = {
  id: number;
  name: string;
  full_name: string;
  description: string;
  [key: string]: unknown;
};

export type branchFile = {
  origin: string[];
  [key: string]: string[];
};

type teamInfo = {
  id: number;
  node_id: string;
  url: string;
  html_url: string;
  name: string;
  slug: string;
  description: string;
  privacy: 'closed';
  permission: 'admin';
  members_url: string;
  repositories_url: string;
  parent: null;
};

type userInfo = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: 'User';
  site_admin: boolean;
};

type ownerInfo = {
  login: string;
  id: number;
  node_id: string;
  url: string;
  repos_url: string;
  events_url: string;
  hooks_url: string;
  issues_url: string;
  members_url: string;
  public_members_url: string;
  avatar_url: string;
  description: string;
};

type appInfo = {
  id: number;
  slug: string;
  node_id: string;
  owner: ownerInfo;
  name: string;
  description: string;
  external_url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  permissions: {
    metadata: permissionInfo;
    contents: permissionInfo;
    issues: permissionInfo;
    single_file: permissionInfo;
  };
  events: ('push' | 'pull_request')[];
};

type dismissalRestrictionInfo = {
  url: string;
  users_url: string;
  teams_url: string;
  users: userInfo[];
  teams: teamInfo[];
};

type permissionInfo = 'read' | 'write';
