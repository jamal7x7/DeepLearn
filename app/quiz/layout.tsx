import './App.css';


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 
  return (
   
            <div >

              {children}

            </div>
         
  );
}
