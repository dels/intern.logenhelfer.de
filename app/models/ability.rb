class Ability
  include CanCan::Ability
 
  def initialize(user)
    return unless user
    @user = user

    @user.roles.each do |role|
      self.send("#{role.name.underscore}_abilities")
    end
  end

  def admin_abilities
    can :manage, Category
    can :manage, Directory
    can :manage, AttachedFile
  end

  def uploader_abilities
    
  end

  def entered_apprentice_abilities  
  end

  def fellow_craft_abilities
  end

  def master_mason_abilities
  end

  def worshipful_master_abilities
  end

  def member_of_council_abilities
  end
end


