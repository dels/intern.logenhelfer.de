require File.dirname(__FILE__) + '/../spec_helper'

describe UsersController do

  describe "admin user actions" do 
    include Devise::TestHelpers
    render_views
    login_admin_user
    
    shared_examples_for "UserAdminUserType" do 
      it "renders index template" do
          get :index
        response.should be_success
        response.should render_template(:index)
      end
      
      it "renders show template" do
        master = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago, :master_mason_since => 3.years.ago)
        get :show, :id => master.id
        response.should be_success
        response.should render_template(:show)
      end
      
      it "renders new template" do
        get :new
        response.should be_success
        response.should render_template(:new)
      end
      
      it "create action should render new template when model is invalid" do
        User.any_instance.stubs(:valid?).returns(false)
        post :create
        response.should be_success
        response.should render_template(:new)
      end
      
      it "create action should redirect when model is valid" do
        User.any_instance.stubs(:valid?).returns(true)
        post :create
        response.should be_success
        response.should redirect_to(user_url(assigns[:user]))
      end
      
      it "edit action should render edit template" do
        master = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago, :master_mason_since => 3.years.ago)
        get :edit, :id => master
        response.should be_success
        response.should render_template(:edit)
      end
    
      it "update action should render edit template when model is invalid" do
        master = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago, :master_mason_since => 3.years.ago)
        put :update, :id => master
        response.should be_success
        response.should render_template(:edit)
      end
      
      it "update action should redirect when model is valid" do
        master = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago, :master_mason_since => 3.years.ago)
        put :update, :id => master
        response.should be_success
        response.should render_template(:index)
      end
      
      it "destroy action should destroy model and redirect to index action" do
        master = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago, :master_mason_since => 3.years.ago)
        delete :destroy, :id => master
        response.should be_success
        response.should redirect_to(users_url)
        User.exists?(master.id).should be_false
      end
    end
  end

  describe "master mason actions" do 
    include Devise::TestHelpers
    render_views
    login_master_mason

    shared_examples_for "ReadOnlyUserType" do 
    
      it "index actions renders index template" do
        get :index
        response.should be_success
        response.should render_template(:index)
      end
    
      it "show actions renders show template" do
        master = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago, :master_mason_since => 3.years.ago)
        get :show, :id => master.id
        response.should be_success
        response.should render_template(:show)
      end
      
      it "new action redirects to login" do
        get :new
        response.should_not be_success
        response.should redirect_to(:login)
      end
      
      it "create action redirects to login" do
        User.any_instance.stubs(:valid?).returns(false)
        post :create
        response.should redirect_to(:login)
      end
      
      it "create action redirects to login" do
        User.any_instance.stubs(:valid?).returns(true)
        post :create
        response.should redirect_to(:login)
      end
      
      it "edit action redirects to login" do
        master = FactoryGirl.create(:user, :entered_apprentice_since => 15.years.ago, :fellow_craft_since => 14.years.ago, :master_mason_since => 13.years.ago)
        get :edit, :id => master
        response.should redirect_to(:login)
      end
      
      it "update action redirects to login" do
        master = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago, :master_mason_since => 3.years.ago)
        put :update, :id => master
        response.should redirect_to(:login)
      end
      
      it "destroy action redirects to login" do
        master = FactoryGirl.create(:user, :entered_apprentice_since => 5.years.ago, :fellow_craft_since => 4.years.ago, :master_mason_since => 3.years.ago)
        delete :destroy, :id => master
        response.should redirect_to(:login)
      end
    end
  end

  describe "entered apprentice actions" do 
    include Devise::TestHelpers
    render_views
    login_apprentice
    it_behaves_like "ReadOnlyUserType"
  end

  describe "fellow craft actions" do 
    include Devise::TestHelpers
    render_views
    login_fellow_craft
    it_behaves_like "ReadOnlyUserType"
  end

    
  describe "secretary action" do 
    include Devise::TestHelpers
    render_views
    login_secretary
    
    AppConfig[:secretary_is_user_admin] = 1
    it_behaves_like "UserAdminUserType"
    AppConfig[:secretary_is_user_admin] = 0
    it_behaves_like "ReadOnlyUserType"
  end

  describe "worshipful master action" do 
    include Devise::TestHelpers
    render_views
    login_whorshipful_master
    
    AppConfig[:worshipful_master_is_user_admin] = 1
    it_behaves_like "UserAdminUserType"
    AppConfig[:worshipful_master_is_user_admin] = 0
    it_behaves_like "ReadOnlyUserType"
  end

  describe "net delegate action" do 
    include Devise::TestHelpers
    render_views
    login_net_delegate
    
    AppConfig[:net_delegate_is_user_admin] = 1
    it_behaves_like "UserAdminUserType"
    AppConfig[:net_delegate_is_user_admin] = 0
    it_behaves_like "ReadOnlyUserType"
  end
end
