FwzeIntern::Application.routes.draw do

  match 'calendar/upcoming',                          to: 'events#upcoming',  as: :upcoming_calendar
  get 'calendar/public_workingplan',                  to: 'events#public_workingplan'
  post 'calendar/public_workingplan',                 to: 'events#public_workingplan'
  get 'calendar/internal_workingplan',                to: 'events#internal_workingplan'
  post 'calendar/internal_workingplan',               to: 'events#internal_workingplan'
  match 'calendar/(:year(/:month(/:day)))(.:format)', to: 'events#date',      as: :calendar
  resources :events

  resources :file_downloads

  get 'users/members_list', to: 'users#members_list'
  get 'users/phone_list', to: 'users#phone_list'
  get 'users/phone_list_pdf', to: 'users#phone_list_pdf'
  get 'users/birthday_list', to: 'users#birthday_list'
  get 'users/birthday_list_pdf', to: 'users#birthday_list_pdf'
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
