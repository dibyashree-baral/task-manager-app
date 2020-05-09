const sgmail = require('@sendgrid/mail')
sgmail.setApiKey(process.env.SENDGRID_API_KEY);

const welcomeMail = (name, email) => {
    sgmail.send({
        to: email,
        from:'dibyashree93@gmail.com',
        subject: 'Congratulations!! your account is created!',
        text:`Dear ${name}!! It feels great onboarding you to the site.`
    })
}

const accountDeletionMail = (name, email) => {
    sgmail.send({
        to: email,
        from:'dibyashree93@gmail.com',
        subject: 'Account dropped off successfully!',
        text:`Dear ${name}!! It is unfurtunate for us to let you go from this site. Please spare a moment to let us know what made you delete your account.`
    })
}

module.exports = {
    accountDeletionMail,
    welcomeMail
}