import React from 'react';

const LandingFeatureCard = ({ title, description, icon: Icon }) => (
  <article className="app-card p-6 md:p-8 h-full flex flex-col hover:shadow-lg hover:border-primary-200 dark:hover:border-night-muted transition-all duration-300">
    <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-200 flex items-center justify-center mb-5">
      <Icon className="w-5 h-5" aria-hidden="true" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{description}</p>
  </article>
);

export default LandingFeatureCard;
