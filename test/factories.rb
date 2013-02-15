FactoryGirl.define do
  sequence :email do |n|
    "mason#{n}@logenhelfer.de"
  end
end

FactoryGirl.define do
  sequence(:matriculation_number,333) do |n|
    n
  end
end


FactoryGirl.define do
  factory :user do
    firstname             "Appr"
    lastname              "Entice"
    email                 
    password              "foobar123"
    password_confirmation "foobar123"
    matriculation_number  
    date_of_birth         50.year.ago
  end

  factory :role do
    # everything will be done controller_macros.rb
  end

end
