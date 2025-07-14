import AdminModel from '../../model/adminAuthModel/index.js';


const findUserByEmail = async (email) => {
  console.log(email)
  let user = await AdminModel.findOne({ email });
  if (user) return { user, model: AdminModel };

  return { user: null, model: null };
};

export default findUserByEmail;
