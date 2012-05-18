FwzeIntern::Application.routes.draw do

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
