import StarMapModel from '../components/StarMapModel/StarMapModel.jsx';

const About = () => {
  return (
    <div>
      <h1>About the constellation map</h1>
      <p>
        This project was kind of hard. I've always wanted to be able to simulate
        stars in the sky and trying to figure out how to do that and to do it
        efficiently was a challenge.
      </p>
      <StarMapModel />
    </div>
  );
};

export default About;
