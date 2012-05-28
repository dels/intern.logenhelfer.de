FwzeIntern::Application.routes.draw do

  match 'calendar/upcoming',                          to: 'events#upcoming',  as: :upcoming_calendar
  match 'calendar/(:year(/:month(/:day)))(.:format)', to: 'events#date',      as: :calendar
  resources :events

  resources :file_downloads

  get 'users/members_list', to: 'users#members_list'
  get 'users/birthday_list', to: 'users#birthday_list'
  post 'users/members_list', to: 'users#members_list'


  resources :users

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
    member do
      get 'substitute'
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
