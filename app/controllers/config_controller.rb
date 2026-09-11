class ConfigController < ApplicationController

    #before_action :token_auth, except: %i[auth login]
    def show
    end

    def auth
         
    end
    def login 
        token_login
    end

    private
    def token_login
      return_to = session[:return_to]

      session[:return_to] = nil
      redirect_to return_to
    end

end
