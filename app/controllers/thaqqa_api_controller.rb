class ThaqqaApiController < ApplicationController
  def render_svg
    res = Faraday.post(
      "#{ENV.fetch("THAQQA_API_URL")}/thaqqa/render/as_path_d"
    ) do |req|
      req.headers["Content-Type"] = "application/json"

      #if cookies.encrypted[:jwt]
      #  req.headers["Authorization"] = "Bearer #{cookies.encrypted[:jwt]}"
      #end

      req.body = request.raw_post
    end

    render json: JSON.parse(res.body), status: res.status
  end
end