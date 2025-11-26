msbuild /t:restore
dotnet build
msbuild /p:configuration=Release