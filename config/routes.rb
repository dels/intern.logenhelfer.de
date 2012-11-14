FwzeIntern::Application.routes.draw do

  scope 'calendar' do
    match 'upcoming',                                 to: 'events#upcoming',  as: :upcoming_calendar
    get   'public_workingplan',                       to: 'events#public_workingplan'
    post  'public_workingplan',                       to: 'events#public_workingplan'
    get   'internal_workingplan',                     to: 'events#internal_workingplan'
    post  'internal_workingplan',                     to: 'events#internal_workingplan'
    match '(:year(/:month(/:day)))(.:format)',        to: 'events#date',      as: :calendar
  end
  resources :events

  resources :file_downloads
  resources :categories do
    resources :directories do
      resources :attached_files do
        member do
          get 'download'
        end
      end
    end
  end

  devise_for :users, path_prefix: 'auth'
  resources :users do
    collection do
      # XXX: both get/post to 'users/members_list' are going to call users#members_list???
      get 'members_list'
      get 'phone_list'
      get 'phone_list_pdf'
      get 'birthday_list'
      get 'birthday_list_pdf'
      post 'members_list'
    end
    member do
      put 'substitute'
      put 'lock'
      put 'unlock'
      put 'disable'
      put 'enable'
      put 'change_state'
      put 'confirm'
    end
  end

  get '/impressum', to: 'statics#impressum', as: :impressum

  root to: 'statics#index'

end
