          case 'security':
              return <SecurityView 
                  onBack={() => goBack('profile')}
                  onProfileClick={handleProfileClick}
              />;
          case 'appearance':
              return <AppearanceView
                  onBack={() => goBack('settings')}
                  themeMode={themeMode}
                  onSetThemeMode={setThemeMode}
              />;
          case 'calculators':
              return <AdvancedCalculatorsView 
                  onBack={() => goBack('menu')}
                  currencySymbol={budgetData.currencySymbol}
                  onProfileClick={handleProfileClick}
                  budgetData={budgetData}
                  user={user}
                  onNavigate={navigate}
                  onViewFeature={setFeatureViewId}
              />;