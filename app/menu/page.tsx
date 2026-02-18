export default function Page() {
  return (
    <div className='bg-black flex h-[100vh]'>
        <div className='mx-auto'>
            <h1 className='text-white text-[30px]  font-bold mt-[30vh] mx-auto '>Select Difficulty</h1>
            <div className='flex flex-col mt-[10px]'>
                <a href='/game?diff=easy'>
                    <button className='bg-white text-black font-bold text-[20px] rounded-[5px] p-2 px-6 mx-auto hover:scale-105 duration-300 mb-[20px] hover:bg-gray-200'>
                        Easy
                    </button>
                </a>
                <a href='/game?diff=medium'>
                    <button className='bg-white text-black font-bold text-[20px] rounded-[5px] p-2 px-6 mx-auto hover:scale-105 duration-300 mb-[20px] hover:bg-gray-200'>
                        Medium
                    </button>
                </a>
                <a href='/game?diff=hard'>
                    <button className='bg-white text-black font-bold text-[20px] rounded-[5px] p-2 px-6 mx-auto hover:scale-105 duration-300 mb-[20px] hover:bg-gray-200'>
                        Hard
                    </button>
                </a>
            </div>
        </div>
    </div>
  )
}