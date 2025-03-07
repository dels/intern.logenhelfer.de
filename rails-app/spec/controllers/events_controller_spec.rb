
require 'spec_helper'

describe EventsController do
  describe "anonymous actions" do 
    include Devise::TestHelpers
    
    it "gets the arbeitsplan" do
      # Note, rails 3.x scaffolding may add lines like get :index, {}, valid_session
      # the valid_session overrides the devise login. Remove the valid_session from your specs
      get 'workingplan'
      response.should be_success
    end
    
    it " doesn't not get the public working plan" do
      # Note, rails 3.x scaffolding may add lines like get :index, {}, valid_session
    # the valid_session overrides the devise login. Remove the valid_session from your specs
      get 'public_workingplan'
      response.should_not be_success
    end
    
    it "doesn't not get the internal working plan" do
      # Note, rails 3.x scaffolding may add lines like get :index, {}, valid_session
      # the valid_session overrides the devise login. Remove the valid_session from your specs
      get 'internal_workingplan'
      response.should_not be_success
    end
  end

  describe "apprentice actions" do
    include Devise::TestHelpers
    login_apprentice
    
    it "should get the arbeitsplan" do
      # Note, rails 3.x scaffolding may add lines like get :index, {}, valid_session
      # the valid_session overrides the devise login. Remove the valid_session from your specs
      get 'workingplan'
      response.should be_success
    end
    
    it "should get the public working plan" do
      # Note, rails 3.x scaffolding may add lines like get :index, {}, valid_session
      # the valid_session overrides the devise login. Remove the valid_session from your specs
      get 'public_workingplan'
      response.should be_success
    end
    
    it "should get the internal working plan" do
      # Note, rails 3.x scaffolding may add lines like get :index, {}, valid_session
      # the valid_session overrides the devise login. Remove the valid_session from your specs
      get 'internal_workingplan'
      response.should be_success
    end
  end

end
