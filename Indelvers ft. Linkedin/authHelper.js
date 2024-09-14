const Authorization=()=>{
    return encodeURI(`https://linkedin.com/oauth/v2/authorization?client_id=${process.env.CLIENT_ID}&response_type=code&scope=${process.env.SCOPE}&redirect_uri=${process.env.REDIRECT_URI}`);
}

const Redirect=(code)=>
{
    const payload={
        code
    }
   // return payload;
}

module.exports={
    Authorization,
    Redirect
} 